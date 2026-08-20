import './machine.css'

export default function FaceSurface({ children, className, ...rest }) {
  const classes = ['face-surface', className].filter(Boolean).join(' ')

  return (
    <section className={classes} {...rest}>
      <div className="face-surface__content">{children}</div>
    </section>
  )
}
