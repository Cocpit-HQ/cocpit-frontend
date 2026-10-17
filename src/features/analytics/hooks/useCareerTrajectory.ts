import { useQuery } from '@tanstack/react-query';
import { MOCK_TRAJECTORY, MOCK_STUDENT_TRAJECTORY } from '../data/mock-data';
import { CareerTrajectorySnapshot } from '../types/trajectory.types';
// import api from "@/lib/axios"; // use api when endpoint is ready

// Mock API call to simulate network request
const getCareerTrajectory = async (selectedRole: string): Promise<CareerTrajectorySnapshot> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(selectedRole === 'junior-designer' ? MOCK_STUDENT_TRAJECTORY : MOCK_TRAJECTORY);
    }, 1500);
  });
};

export function useCareerTrajectory(selectedRole: string) {
  return useQuery({
    queryKey: ['analytics', 'career-trajectory', selectedRole],
    queryFn: () => getCareerTrajectory(selectedRole),
    enabled: false,
    staleTime: 15 * 60 * 1000,
    retry: 1,
  });
}
