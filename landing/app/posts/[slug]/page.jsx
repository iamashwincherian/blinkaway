import { notFound } from 'next/navigation'
import { DownloadButtons, Ghost } from '../../parts'
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
      <a className="back" href={p.kind === 'update' ? '/#updates' : '/#guides'}>← {p.kind === 'update' ? 'All updates' : 'All guides'}</a>
      <small className="caps">{p.kind === 'update' ? p.date : 'Guide'}</small>
      <h1>{p.title}</h1>
      <p className="lede">{p.summary}</p>
      <div className={`post-art bg-${p.bg}`}><Ghost face={p.face} className="float" /></div>
      {p.body.map((para, i) => <p key={i}>{para}</p>)}
      <div className="article-cta">
        <h2>Let Distant keep count</h2>
        <DownloadButtons />
      </div>
    </main>
  )
}
