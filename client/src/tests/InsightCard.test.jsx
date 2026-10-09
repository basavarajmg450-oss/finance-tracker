import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InsightCard } from '../components/InsightCard.jsx';

describe('InsightCard Component', () => {
  it('should render rule-based insight with calculation breakdown', () => {
    const mockInsight = {
      id: 'test-spike',
      type: 'warning',
      title: 'Food Spending Spike',
      message: 'Spending on Food is up by 45% compared to last month.',
      calculation: 'Current: $350 vs Previous: $200 (+45%)',
      category: 'Food'
    };

    render(<InsightCard insight={mockInsight} />);

    expect(screen.getByText(/Food Spending Spike/)).toBeInTheDocument();
    expect(screen.getByText(/Spending on Food is up by 45%/)).toBeInTheDocument();
    expect(screen.getByText(/Current: \$350 vs Previous: \$200/)).toBeInTheDocument();
    expect(screen.getByText('Food')).toBeInTheDocument();
  });
});
