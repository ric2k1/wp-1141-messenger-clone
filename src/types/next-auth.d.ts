import 'next-auth'
import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string
      alias: string
      email: string | null
      image: string | null
    } & DefaultSession['user']
    provider?: string
    oauthId?: string
  }

  interface JWT {
    id?: string
    alias?: string
    email?: string | null
    image?: string | null
    provider?: string
    oauthId?: string
  }
}

