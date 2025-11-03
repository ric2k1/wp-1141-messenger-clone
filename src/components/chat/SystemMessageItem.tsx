'use client'

interface SystemMessageItemProps {
  message: {
    id: string
    content: string
    createdAt: Date | string
  }
}

export default function SystemMessageItem({ message }: SystemMessageItemProps) {
  return (
    <div className="flex justify-center my-3">
      <div className="bg-notion-gray-border text-notion-text-secondary text-xs px-3 py-1.5 rounded-full font-medium">
        {message.content}
      </div>
    </div>
  )
}

