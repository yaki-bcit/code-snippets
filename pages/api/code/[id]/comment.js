import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

import { authOptions } from '../../auth/[...nextauth]'
import { unstable_getServerSession } from "next-auth/next"

export default async function handler(req, res) {
  const { method } = req
  switch (method) {
    case 'GET':
      const comments = await prisma.comment.findMany({
        where: {
          postId: parseInt(req.query.id)
        },
        include: {
          user: true,
        },
        orderBy: {
          createdAt: 'desc'
        },
      })
      res.status(200).json({ success: true, comments: comments })
      break
    case 'POST':
      const session = await unstable_getServerSession(req, res, authOptions)
      if (!session) {
        res.status(401).send('Unauthorized')
        return
      }
      const prismaUser = await prisma.user.findUnique({
        where: {
          email: session.user.email,
        }
      })
      const result = await prisma.comment.create({
        data: {
          userId: prismaUser.id,
          postId: parseInt(req.query.id),
          content: req.body.comment,
        },
        include: {
          user: true,
        },
      })
      res.status(201).json({ success: true, comment: result })
      await prisma.post.update({
        where: {
          id: parseInt(req.query.id)
        },
        data: {
          totalComments: {
            increment: 1
          }
        }
      })
      break
    default:
      res.setHeader('Allow', ['POST'])
      res.status(405).end(`Method ${method} Not Allowed`)
  }
}
