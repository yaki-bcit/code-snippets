import { useSession, signIn, signOut } from "next-auth/react"
import { authOptions } from './api/auth/[...nextauth]'
import { unstable_getServerSession } from "next-auth/next"
import { useEffect, useState } from 'react'

import SiteNavigation from "../components/SiteNavigation"
import PostSmall from "../components/PostSmall"
import Comment from "../components/Comment"

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

import axios from 'axios'

export default function ProfilePage({ posts, comments }) {
  const { data: session } = useSession()
  const [postList, setPostList] = useState(posts)

  const handleLike = async (post) => {
    if (!session) {
      router.push('/api/auth/signin')
    }

    if (post.liked) {
      await axios.delete(`/api/code/${post.id}/like`)
      post = {
        ...post,
        likes: post.likes.filter(like => like.userId !== session.user.id),
        liked: false,
        totalLikes: post.totalLikes - 1,
      }
      setPostList(postList.map((p) => p.id === post.id ? post : p))
    } else {
      await axios.post(`/api/code/${post.id}/like`)
      post = {
        ...post,
        likes: [...post.likes, { userId: session.user.id }],
        liked: true,
        totalLikes: post.totalLikes + 1,
      }
      setPostList(postList.map((p) => p.id === post.id ? post : p))
    }
  }

  const handleComment = async (comment, post) => {
    if (!session) {
      router.push('/api/auth/signin')
    }

    await axios.post(`/api/code/${post.id}/comment`, comment)
    setPostList(postList.map((p) => p.id === post.id ? { ...p, totalComments: p.totalComments + 1 } : p))
  }

  useEffect(() => {
    setPostList(
      posts.map((post) => {
        return {
          ...post,
          liked: post.likes.some((like) => like.email === session.user.email),
        }
      })
    )
  }, [session])

  if (session) {
    return (
      <>
        <SiteNavigation />

        <div className='max-w-2xl mx-auto'>
          <p className="mt-8 mb-4 ">
            Signed in as {session.user.name} ({session.user.email})
          </p>

          <img
            src={session.user.image}
            className="rounded-full w-32"
          />
          
          <p className="mt-4 mb-4">
            <button onClick={() => signOut()} >Sign out</button>
          </p>

          <hr></hr>
          <h1 className="mt-8 mb-4 text-xl">
            Your posts
          </h1>

          <ul className='mt-4 mb-4'>
            {postList.map((post) => (
              <li key={post.id}>
                <PostSmall 
                  post={post} 
                  user={post.user}
                  href={`/code/${post.id}`}
                  className='mv-10'
                  onLike={handleLike}
                  onComment={handleComment}
                  onShare={() => console.log('share: ' + post.id)}
                />
              </li>
            ))}
          </ul>

          <hr></hr>

          <h1 className="mt-8 mb-4 text-xl">
            Your comments
          </h1>

          <ul className="mt-4">
            {comments.map((comment) => (
              <li className="mb-4" key={comment.id}>
                <Comment comment={comment} user={session.user} />
              </li>
            ))}
          </ul>

        </div>
      </>
    )
  }

  return (
    <>
      <SiteNavigation />
      Not signed in <br />
      <button onClick={() => signIn()}>Sign in</button>
    </>
  )
}

export async function getServerSideProps(context) {
  const session = await unstable_getServerSession(context.req, context.res, authOptions)

  if (!session) {
    return {
      redirect: {
        destination: '/api/auth/signin',
        permanent: false,
      },
    }
  }

  console.log(session.user)

  const { id } = await prisma.user.findUnique({
    where: {
      email: session.user.email
    }
  })

  const posts = await prisma.post.findMany({
    where: {
      userId: id
    },
    include: {
      user: true,
      likes: true,
      comments: true
    }
  })

  const comments = await prisma.comment.findMany({
    where: {
      userId: id
    },
    include: {
      user: true
    }
  })

  return {
    props: {
      session,
      posts: JSON.parse(JSON.stringify(posts)),
      comments: JSON.parse(JSON.stringify(comments)),
    }
  }
}
