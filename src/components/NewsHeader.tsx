import { PageWordmark } from '@/components/PageWordmark'

export function NewsHeader({ article = false }: { article?: boolean }) {
  const Title = article ? 'p' : 'h1'
  return (
    <header>
      <PageWordmark />
      <Title className="page-subtitle mb-8 text-center text-[0.779625rem] font-normal text-text-secondary sm:text-[0.86625rem]">
        News
      </Title>
    </header>
  )
}
