import Link from "next/link";

export function ActivityCard({ title, description, href, symbol, tone }: { title:string; description:string; href:string; symbol:string; tone:"ink"|"blue" }) {
  return <Link href={href} className="activity-card">
    <span className={`activity-icon ${tone}`}>{symbol}</span>
    <h3>{title}</h3><p>{description}</p><span className="activity-link">Open builder <span aria-hidden="true">→</span></span>
  </Link>;
}
