import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

import { authOptions } from '../../auth/[...nextauth]'
import { unstable_getServerSession } from "next-auth/next"

export default async function handler(req, res) {
  const { method } = req

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

  switch (method) {
    case 'POST':
      // update the post
      await prisma.post.update({
        where: {
          id: parseInt(req.query.id),
        },
        data: {
          totalLikes: {
            increment: 1
          },
        }
      })

      // create the like
      await prisma.like.create({
        data: {
          userId: prismaUser.id,
          email: prismaUser.email,
          postId: parseInt(req.query.id),
        }
      })

      res.status(201).json('Like added')
      break
    case 'DELETE':
      // update the post
      await prisma.post.update({
        where: {
          id: parseInt(req.query.id),
        },
        data: {
          totalLikes: {
            decrement: 1
          },
        }
      })

      // delete the like
      await prisma.like.delete({
        where: {
          postId: parseInt(req.query.id),
          userId: prismaUser.id,
        }
      })

      res.status(201).json('Like removed')
      break
    default:
      res.setHeader('Allow', ['POST', 'DELETE'])
      res.status(405).end(`Method ${method} Not Allowed`)
  }
}