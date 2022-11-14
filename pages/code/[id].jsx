import { useEffect, useState } from 'react'
import { useRouter  } from 'next/router'
import { useSession, signIn, signOut } from "next-auth/react"

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

import axios from 'axios'

import SiteNavigation from '../../components/SiteNavigation'
import Post from '../../components/Post'
import Comments from '../../components/Comments'
import CommentForm from '../../components/CommentForm'

export default function PostPage({ post }) {
  const [comments, setComments] = useState([])
  const [liked, setLiked] = useState(false)
  const [totalLikes, setTotalLikes] = useState(post.totalLikes)
  const [totalComments, setTotalComments] = useState(post.totalComments)
  const [showCommentForm, setShowCommentForm] = useState(false)
  const [shared, setShared] = useState(false)

  const router = useRouter()
  const { id } = router.query

  const { data: session } = useSession()

  const handleLike = async () => {
    if (liked) {
      //await axios.delete(`/api/code/${id}/like`)
      setTotalLikes(totalLikes - 1)
      setLiked(false)
    } else {
      //await axios.post(`/api/code/${id}/like`)
      setTotalLikes(totalLikes + 1)
      setLiked(true)
    }
  }

  const handleShowCommentForm = async () => {
    if (!session) {
      router.push('/api/auth/signin')
    }
    setShowCommentForm(!showCommentForm)
  }

  const handleSubmitComment = async (comment) => {
    setShowCommentForm(false)
    setTotalComments(totalComments + 1)
    const { data } = await axios.post(`/api/code/${id}/comment`, comment)
    setComments([data.comment, ...comments])
  }

  const handleShare = async (code) => {
    setShared(false)
    await navigator.clipboard.writeText(code)
    setShared(true)
  }

  useEffect(() => {
    (async () => {
      const { data } = await axios.get(`/api/code/${id}/comment`)
      setComments(data.comments)
    })();
  }, [])

  // set liked to true if the user has liked the post
  useEffect(() => {
    if (session) {
      setLiked(post.likes.some(like => like.email === session.user.email))
    }
  }, [session])

  return (
    <div className="pt-8 pb-10 lg:pt-12 lg:pb-14 mx-auto max-w-7xl px-2">
      <SiteNavigation />

      <div className='max-w-2xl mx-auto'>
        <h1 className='text-xl text-center mt-8 mb-0'>
          Snippet #{id}
        </h1>

        <ul className='mt-4'>
          <li>
            {post && <Post 
              post={post} 
              user={post.user}
              liked={liked}
              shared={shared}
              totalLikes={totalLikes}
              totalComments={totalComments}
              className='mv-10'
              onLike={handleLike}
              onComment={handleShowCommentForm}
              onShare={handleShare}
            />}

            {showCommentForm && session && <CommentForm postId={id} user={session.user} onSubmit={handleSubmitComment} />}

            {comments && <Comments comments={comments} />}
          </li>
        </ul>
      </div>
    </div>
  )
}

export async function getStaticPaths() {
  const posts = await prisma.post.findMany({})
  const paths = posts.map((post) => ({ params: { id: post.id.toString() } }))
  return { paths, fallback: false }
}

export async function getStaticProps(context) {
  const id = parseInt(context.params.id)
  const post = await prisma.post.findUnique({
    where: {
      id: id
    },
    include: {
      user: true,
      comments: true,
      likes: true,
    },
  })

  return {
    props: {
      post: JSON.parse(JSON.stringify(post)),
    },
  }
}
