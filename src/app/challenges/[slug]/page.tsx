import Link from "next/link";
import { ChallengeRunner } from "@/app/challenges/challenge-runner";

type Props = { params: Promise<{ slug: string }> };

export default async function ChallengePage({ params }: Props) {
  const { slug } = await params;
  return (
    <main className="challenge-page">
      <header className="dashboard-header">
        <Link className="brand" href="/"><span className="brand-mark">A</span><span>APTIVIO</span></Link>
        <nav className="challenge-nav"><Link href="/challenges">All challenges</Link><Link href="/progress">My progress</Link></nav>
      </header>
      <ChallengeRunner slug={slug} />
    </main>
  );
}
