import { Hero } from '@/components/marketing/hero'
import { FeatureGrid } from '@/components/marketing/feature-grid'
import { Steps } from '@/components/marketing/steps'
import { SocialProof } from '@/components/marketing/social-proof'
import { Comparison } from '@/components/marketing/comparison'
import { FinalCTA } from '@/components/marketing/final-cta'
import { Navbar } from '@/components/marketing/navbar'
import { Footer } from '@/components/marketing/footer'

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <FeatureGrid />
        <Steps />
        <SocialProof />
        <Comparison />
        <FinalCTA />
      </main>
      <Footer />
    </>
  )
}