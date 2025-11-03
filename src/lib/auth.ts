import NextAuth from "next-auth"
import Facebook from "next-auth/providers/facebook"
import GitHub from "next-auth/providers/github"
import { prisma } from "./prisma"

export const {
  handlers,
  auth,
  signIn,
  signOut,
} = NextAuth({
  trustHost: true,
  providers: [
    Facebook({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'public_profile',
        }
      }
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'read:user user:email',
        }
      }
    }),
  ],
  pages: {
    error: "/auth/error",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (!account) return false
      
      try {
        // First, check if user exists with matching provider and OAuth ID (already authorized)
        let existingUser = await prisma.user.findFirst({
          where: {
            provider: account.provider,
            oauthId: account.providerAccountId,
            isAuthorized: true,
          },
        })
        
        if (existingUser) {
          // Update user info
          await prisma.user.update({
            where: { id: existingUser.id },
            data: {
              email: user.email,
              image: user.image,
              name: user.name,
            },
          })
          return true
        }
        
        // If not found, check for pending authorization (user created by authorize API)
        const pendingUser = await prisma.user.findFirst({
          where: {
            provider: account.provider,
            isAuthorized: false,
            oauthId: {
              startsWith: 'temp-' // Temporary OAuth ID
            }
          },
          orderBy: {
            createdAt: 'desc' // Get the most recently created pending user
          }
        })
        
        if (pendingUser) {
          // Update the pending user with real OAuth ID but DON'T authorize yet
          // Authorization will be finalized in callback-setup route
          await prisma.user.update({
            where: { id: pendingUser.id },
            data: {
              oauthId: account.providerAccountId,
              email: user.email,
              image: user.image,
              name: user.name,
            },
          })
          return true
        }
        
        // No matching user found - reject sign in
        return false
      } catch (error) {
        console.error('Error in signIn callback:', error)
        return false
      }
    },
    async jwt({ token, user, account }) {
      if (user && account) {
        // Find the user in our database to get our internal ID and alias
        const dbUser = await prisma.user.findFirst({
          where: {
            provider: account.provider,
            oauthId: account.providerAccountId,
            isAuthorized: true,
          },
        })
        
        if (dbUser) {
          token.id = dbUser.id
          token.alias = dbUser.alias  // Use alias instead of OAuth name
          token.email = user.email
          token.image = user.image
          token.provider = account.provider
          token.oauthId = account.providerAccountId
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string
        session.user.alias = token.alias as string
        session.user.email = token.email as string
        session.user.image = token.image as string
        // @ts-expect-error - Adding custom properties
        session.provider = token.provider
        // @ts-expect-error - Adding custom properties
        session.oauthId = token.oauthId
      }
      return session
    },
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
})

export async function getCurrentSession() {
  return await auth()
}

