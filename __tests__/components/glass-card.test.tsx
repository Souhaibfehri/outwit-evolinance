import { render, screen } from '@testing-library/react'
import { GlassCard, AnimatedNumber } from '@/components/ui/glass-card'

describe('Glass Card Components', () => {
  describe('GlassCard', () => {
    it('should render children correctly', () => {
      render(
        <GlassCard>
          <div>Test Content</div>
        </GlassCard>
      )
      
      expect(screen.getByText('Test Content')).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      const { container } = render(
        <GlassCard className="custom-class">
          <div>Test</div>
        </GlassCard>
      )
      
      expect(container.firstChild).toHaveClass('custom-class')
    })
  })

  describe('AnimatedNumber', () => {
    it('should format number with prefix and suffix', () => {
      render(
        <AnimatedNumber 
          value={1234} 
          prefix="$" 
          suffix="/month"
        />
      )
      
      expect(screen.getByText('$1,234/month')).toBeInTheDocument()
    })

    it('should format large numbers with commas', () => {
      render(
        <AnimatedNumber value={1234567} />
      )
      
      expect(screen.getByText('1,234,567')).toBeInTheDocument()
    })
  })
})
