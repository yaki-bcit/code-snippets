import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export default async function handler(req, res) {
  const { method } = req

  switch (method) {
    case 'GET':
      const post = await prisma.post.findUnique({
        where: {
          id: parseInt(req.query.id)
        },
        include: {
          user: true,
          comments: true
        },
      })

      res.status(200).json({ success: true, post: post })
      break
    default:
      res.setHeader('Allow', ['GET'])
      res.status(405).end(`Method ${method} Not Allowed`)
  }
}