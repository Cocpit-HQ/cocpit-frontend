import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { JobTabs } from './JobTabs'; // Adjust the import path as necessary
import { JobListMode, JobStatus } from '@/types/jobs';

describe('JobTabs', () => {
  const setMode = jest.fn();
  const setMyJobsTab = jest.fn();

  const defaultProps = {
    mode: 'view' as JobListMode,
    setMode,
    myJobsTab: 'in-progress' as JobStatus,
    setMyJobsTab,
    offersCount: 5,
  };

  it('renders the main tabs correctly', () => {
    render(<JobTabs {...defaultProps} />);
    expect(screen.getByText('View Jobs')).toBeInTheDocument();
    expect(screen.getByText('My Jobs')).toBeInTheDocument();
    expect(screen.getByText('Offers')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('does not show sub-tabs when "My Jobs" is not selected', () => {
    render(<JobTabs {...defaultProps} />);
    expect(screen.queryByText('In Progress')).not.toBeInTheDocument();
    expect(screen.queryByText('Applied')).not.toBeInTheDocument();
  });

  it('shows sub-tabs when "My Jobs" is selected', () => {
    render(<JobTabs {...defaultProps} mode="my-jobs" />);
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Applied')).toBeInTheDocument();
    expect(screen.getByText('In Past')).toBeInTheDocument();
    expect(screen.getByText('Saved')).toBeInTheDocument();
  });

  it('calls setMode when a main tab is clicked', () => {
    render(<JobTabs {...defaultProps} />);
    fireEvent.click(screen.getByText('My Jobs'));
    expect(setMode).toHaveBeenCalledWith('my-jobs');
  });

  it('calls setMyJobsTab when a sub-tab is clicked', () => {
    render(<JobTabs {...defaultProps} mode="my-jobs" />);
    fireEvent.click(screen.getByText('Applied'));
    expect(setMyJobsTab).toHaveBeenCalledWith('applied');
  });

  it('applies active styles correctly for the main tab', () => {
    render(<JobTabs {...defaultProps} />);
    const viewJobsButton = screen.getByText('View Jobs').closest('button');
    expect(viewJobsButton).toHaveClass('bg-gradient-to-r');
  });

  it('applies active styles correctly for the sub-tab', () => {
    render(<JobTabs {...defaultProps} mode="my-jobs" />);
    const inProgressButton = screen.getByText('In Progress').closest('button');
    expect(inProgressButton).toHaveClass('bg-gradient-to-r');
  });
});
