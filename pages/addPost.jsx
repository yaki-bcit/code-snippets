import NewPostForm from '../components/NewPostForm';
import SiteNavigation from '../components/SiteNavigation';

import { useSession, signIn, signOut } from "next-auth/react"
import { authOptions } from './api/auth/[...nextauth]'
import { unstable_getServerSession } from "next-auth/next"
import Router, { useRouter } from 'next/router'

import axios from 'axios';

export default function AddPost() {
  const { data: session } = useSession()
  const router = useRouter()

  const handleSubmit = async ({ code, language }) => {
    const { data } = await axios.post('/api/code', {
      code,
      language,
    })
    router.push('/')
  }

  if (session) {
    return (
      <div className="pt-8 pb-10 lg:pt-12 lg:pb-14 mx-auto max-w-7xl px-2">
        <SiteNavigation />
        <h1 className='text-xl text-center mt-8'>
          Add a new post
        </h1>
        <NewPostForm 
          onSubmit={handleSubmit}
          onChange={(data) => console.log(data)}
        />
      </div>
    );
  }
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

  return {
    props: {
      session,
    }
  }
}