import { Link } from 'react-router-dom'

// The affiliation chip beside a project name. Links to whoever the project was
// built for: an internal route for the Made By Moonlight sub-site, an external
// one for Meta. `slug` picks the brand color in CSS.
export default function OrgTag({ org }) {
  if (!org) return null

  const className = `org-tag ${org.slug}`
  const label = `${org.name} (opens ${org.internal ? 'the' : 'an external'} page)`

  if (org.internal) {
    return (
      <Link to={org.href} className={className} title={label}>
        {org.name}
      </Link>
    )
  }
  return (
    <a
      href={org.href}
      className={className}
      title={label}
      target="_blank"
      rel="noopener noreferrer"
    >
      {org.name}
    </a>
  )
}
