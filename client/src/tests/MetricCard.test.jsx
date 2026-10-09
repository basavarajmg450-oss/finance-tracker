import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MetricCard } from '../components/MetricCard.jsx';

describe('MetricCard Component', () => {
  it('should render title, value, and subtitle correctly', () => {
    render(
      <MetricCard
        title="Total Income"
        value="$5,200.00"
        subtitle="Earned this month"
        badge="Inflow"
        trend="positive"
      />
    );

    expect(screen.getByText('Total Income')).toBeInTheDocument();
    expect(screen.getByText('$5,200.00')).toBeInTheDocument();
    expect(screen.getByText('Earned this month')).toBeInTheDocument();
    expect(screen.getByText('Inflow')).toBeInTheDocument();
  });
});
