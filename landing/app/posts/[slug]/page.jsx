import { notFound } from 'next/navigation'
import { DownloadButtons, G } from '../../parts'
import { POSTS } from '../../posts'

export const dynamicParams = false
export const generateStaticParams = () => POSTS.map(p => ({ slug: p.slug }))

export async function generateMetadata({ params }) {
  const { slug } = await params
  const p = POSTS.find(p => p.slug === slug)
  return p && { title: `${p.title} — Distant`, description: p.summary }
}

export default async function Post({ params }) {
  const { slug } = await params
  const p = POSTS.find(p => p.slug === slug)
  if (!p) notFound()
  return (
    <main className="wrap article">
      <a className="back" href="/#journal">← Journal</a>
      <small>{p.kind === 'update' ? p.date : 'Guide'}</small>
      <h1>{p.title}</h1>
      <p className="lede">{p.summary}</p>
      <div className={`post-art bg-${p.bg}`}><G c="float" face={p.face} /></div>
      {p.body.map((para, i) => <p key={i}>{para}</p>)}
      <div className="article-cta">
        <h2>Look up. We’ll keep time.</h2>
        <DownloadButtons />
      </div>
    </main>
  )
}
