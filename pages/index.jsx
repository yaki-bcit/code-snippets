/* import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient() */

import PostSmall from '../components/PostSmall'
import SiteNavigation from "../components/SiteNavigation"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useSession, signIn, signOut } from "next-auth/react"

import axios from 'axios'

export default function Home() {
  const { data: session } = useSession()
  const router = useRouter()

  const [postList, setPostList] = useState([])

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

  const handleShare = async (code) => {
    await navigator.clipboard.writeText(code)
  }

  const handleComment = async (comment, post) => {
    if (!session) {
      router.push('/api/auth/signin')
    }

    await axios.post(`/api/code/${post.id}/comment`, comment)
    setPostList(postList.map((p) => p.id === post.id ? { ...p, totalComments: p.totalComments + 1 } : p))
  }

  // update postList when the session changes
  useEffect(() => {
    (async () => {
      const { data } = await axios.get('/api/code')
      setPostList(data.posts.map((post) => {
        return {
          ...post,
          liked: post.likes.some((like) => like.email === session?.user.email),
        }
      }))
    })();
  }, [])

  useEffect(() => {
    setPostList(
      postList.map((post) => {
        return {
          ...post,
          liked: post.likes.some((like) => like.email === session?.user.email),
        }
      })
    )
  }, [session])

  return (
    <div className="pt-8 pb-10 lg:pt-12 lg:pb-14 mx-auto max-w-7xl px-2">
      <SiteNavigation />

      <div className='max-w-2xl mx-auto'>
        <h1 className='text-xl text-center mt-8 mb-0'>
          All snippets
        </h1>

        <ul className='mt-4'>
          {!postList.length && (
            <span>Loading...</span>
          )}

          {postList.length > 0 && postList.map((post) => (
            <li key={post.id}>
              <PostSmall 
                post={post} 
                user={post.user}
                href={`/code/${post.id}`}
                className='mv-10'
                onLike={handleLike}
                onComment={handleComment}
                onShare={handleShare}
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}