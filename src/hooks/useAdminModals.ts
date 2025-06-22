
import { useState } from 'react';
import { useForm } from 'react-hook-form';

interface Project {
  id: string;
  title: string;
  author: string;
  authorEmail: string;
  category: string;
  goal: number;
  description: string;
  submittedDate: string;
  status: string;
  user_id: string;
  raised_amount?: number;
  backers_count?: number;
  deadline?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  youtube_url?: string;
  featured_image?: string;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  tokens: number;
  projects: number;
  totalRaised: number;
  status: string;
  joinDate: string;
  avatar: string;
  phone: string;
  bio: string;
  lastLogin: string;
}

export const useAdminModals = () => {
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isUserDetailModalOpen, setIsUserDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isProjectDetailModalOpen, setIsProjectDetailModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const form = useForm({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      bio: '',
      tokens: 0,
    }
  });

  const handleViewUserDetails = (user: AdminUser) => {
    setSelectedUser(user);
    setIsUserDetailModalOpen(true);
  };

  const handleEditUser = (user: AdminUser) => {
    setSelectedUser(user);
    form.reset({
      name: user.name,
      email: user.email,
      phone: user.phone,
      bio: user.bio,
      tokens: user.tokens,
    });
    setIsEditModalOpen(true);
  };

  const handleRejectProject = (project: Project) => {
    setSelectedProject(project);
    setIsRejectModalOpen(true);
  };

  const handleCancelReject = () => {
    setIsRejectModalOpen(false);
    setRejectionReason('');
    setSelectedProject(null);
  };

  const handleViewProjectDetails = (project: Project) => {
    setSelectedProject(project);
    setIsProjectDetailModalOpen(true);
  };

  return {
    selectedUser,
    selectedProject,
    isUserDetailModalOpen,
    isEditModalOpen,
    isRejectModalOpen,
    isProjectDetailModalOpen,
    rejectionReason,
    form,
    setIsUserDetailModalOpen,
    setIsEditModalOpen,
    setIsRejectModalOpen,
    setIsProjectDetailModalOpen,
    setRejectionReason,
    setSelectedUser,
    setSelectedProject,
    handleViewUserDetails,
    handleEditUser,
    handleRejectProject,
    handleCancelReject,
    handleViewProjectDetails
  };
};
