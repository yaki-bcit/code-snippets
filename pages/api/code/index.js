import { authOptions } from '../auth/[...nextauth]'
import { unstable_getServerSession } from "next-auth/next"

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

function titleFromCode(code) {
  return code.trim().split('\n')[0].replace('// ', '')
}

export default async function handler(req, res) {
  const { method } = req

  switch (method) {
    case 'GET':
      const posts = await prisma.post.findMany({
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          user: true,
        },
      })

      res.status(200).json({ success: true, posts: posts })
      break
    case 'POST':
      const session = await unstable_getServerSession(req, res, authOptions)
      if (!session) {
        res.status(401).send('Unauthorized')
        return
      }

      const {language, code} = req.body
      const title = titleFromCode(code)
      const prismaUser = await prisma.user.findUnique({
        where: {
          email: session.user.email
        }
      })

      if (!prismaUser) {
        res.status(401).send('Unauthorized')
        return
      }

      const post = await prisma.post.create({
        data: {
          title,
          language,
          code,
          userId: prismaUser.id
        },
      })
      res.status(201).json(post)
      break
    default:
      res.setHeader('Allow', ['GET', 'POST'])
      res.status(405).end(`Method ${method} Not Allowed`)
  }
}