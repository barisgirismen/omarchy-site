import patrons from '@/data/patrons.json'
import { TeamClusters } from '@/components/TeamClusters'

const membersOf = (...ids: string[]) =>
  patrons
    .filter((group) => ids.includes(group.id))
    .flatMap((group) => group.members)

const groups = [
  {
    id: 'founding-patrons',
    name: 'Founding Patrons',
    description: '$1,000,000 from each',
    members: membersOf('founding-patrons'),
  },
  {
    id: 'founding-corporate-patrons',
    name: 'Founding Corporate Patrons',
    description: '$1,000,000/year x 3 or $1,500,000 in tokens',
    members: membersOf('founding-token-patrons'),
  },
  {
    id: 'distinguished-patrons',
    name: 'Distinguished Patrons',
    description: '$100,000 from each',
    members: membersOf('distinguished-patrons'),
  },
  {
    id: 'distinguished-corporate-patrons',
    name: 'Distinguished Corporate Patrons',
    description: '$100,000/year x 3 or $150,000 in tokens',
    members: membersOf('distinguished-corporate-patrons'),
  },
]

export function PatronHighlights() {
  return (
    <div>
      <TeamClusters
        groups={groups}
        maxFaces={12}
        className="sm:grid-cols-1 lg:grid-cols-2"
      />
      <p className="mt-4 font-mono text-xs text-text-muted">
        <a
          href="https://oligarchy.fyi"
          className="underline decoration-border-strong underline-offset-4 hover:text-text hover:decoration-current focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          Our shadowy agenda? Better Linux.
        </a>
      </p>
    </div>
  )
}
