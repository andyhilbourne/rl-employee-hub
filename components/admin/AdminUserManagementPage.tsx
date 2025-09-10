
import React, { useState, useEffect, useCallback } from 'react';
import { User } from '../../types';
import { userService } from '../../services/userService';
import { Button } from '../Button';
import { LoadingSpinner } from '../LoadingSpinner';
import { UsersIcon, ClipboardIcon, CheckIcon } from '../icons';

const ADD_NEW_ROLE_VALUE = "-- Add New Role --";

const PasswordModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  username: string;
  tempPass: string;
}> = ({ isOpen, onClose, username, tempPass }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(tempPass).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
      <div className="bg-white p-6 rounded-xl shadow-2xl max-w-md w-full transform transition-all">
        <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <CheckIcon className="h-6 w-6 text-green-600" aria-hidden="true" />
            </div>
            <h3 className="mt-3 text-2xl font-semibold leading-6 text-gray-900">User Created Successfully!</h3>
        </div>
        <p className="mt-4 text-gray-600 text-center">An account has been created for <span className="font-semibold">{username}</span>.</p>
        
        <div className="mt-5">
            <label className="block text-sm font-medium text-gray-700">Temporary Password:</label>
            <div className="mt-1 p-3 bg-gray-100 rounded-lg flex items-center justify-between gap-4">
                <span className="font-mono text-lg text-gray-800 break-all">{tempPass}</span>
                <Button onClick={handleCopyPassword} variant="ghost" size="sm" leftIcon={copied ? <CheckIcon className="w-5 h-5 text-green-600" /> : <ClipboardIcon className="w-5 h-5" />}>
                {copied ? 'Copied!' : 'Copy'}
                </Button>
            </div>
        </div>

        <p className="mt-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg font-medium text-center">
            Please share this password with the user securely. They should change it after their first login.
        </p>

        <div className="mt-6">
            <Button onClick={onClose} className="w-full justify-center">Close</Button>
        </div>
      </div>
    </div>
  );
};


export const AdminUserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [newUsername, setNewUsername] = useState('');
  const [newName, setNewName] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('Field Worker');
  const [customRoleName, setCustomRoleName] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newUserDetails, setNewUserDetails] = useState<{ username: string; tempPass: string } | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedUsers = await userService.getAllUsers();
      // Filter out the primary admin to prevent them from being managed here
      setUsers(fetchedUsers.filter(u => u.username !== 'andyhilbourne@gmail.com'));
    } catch (err) {
      setError('Failed to fetch users.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage(null);
    setError(null);

    let roleToSave = selectedRole;
    if (selectedRole === ADD_NEW_ROLE_VALUE) {
      if (!customRoleName.trim()) {
        setError("Please enter a name for the custom role.");
        setIsSubmitting(false);
        return;
      }
      roleToSave = customRoleName.trim();
    }
    
    // Auto-generate a temporary password for the new user
    const tempPassword = `${newName.split(' ')[0].toLowerCase()}${Math.floor(100 + Math.random() * 900)}`;

    try {
      const userToCreate = { username: newUsername, name: newName, role: roleToSave };
      await userService.createUser(userToCreate, tempPassword);
      
      setNewUserDetails({ username: newUsername, tempPass: tempPassword });
      setShowPasswordModal(true);

      setNewUsername('');
      setNewName('');
      setSelectedRole('Field Worker');
      setCustomRoleName('');
      fetchUsers();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create user.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setShowPasswordModal(false);
    setNewUserDetails(null);
  };

  const handleResetPassword = async (user: User) => {
    if (!window.confirm(`Are you sure you want to send a password reset email to ${user.name} (${user.username})?`)) {
        return;
    }
    setSubmitMessage(null);
    setError(null);
    try {
        await userService.sendPasswordResetEmail(user.username);
        setSubmitMessage(`A password reset email has been sent to ${user.username}.`);
    } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to send reset email.');
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><LoadingSpinner /></div>;
  }

  return (
    <>
    {newUserDetails && (
        <PasswordModal 
            isOpen={showPasswordModal}
            onClose={handleCloseModal}
            username={newUserDetails.username}
            tempPass={newUserDetails.tempPass}
        />
    )}
    <div className="space-y-6">
      <div className="flex items-center text-gray-700 mb-6 pb-2 border-b-2 border-teal-500">
        <UsersIcon className="w-8 h-8 mr-3 text-teal-600" />
        <h2 className="text-3xl font-bold">User Management</h2>
      </div>
      
      {submitMessage && <p className="text-sm text-green-700 bg-green-100 p-3 rounded-md">{submitMessage}</p>}
      {error && <p className="text-sm text-red-700 bg-red-100 p-3 rounded-md">{error}</p>}

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4 text-gray-700">Create New User</h3>
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div>
            <label htmlFor="newUsername" className="block text-sm font-medium text-gray-700">Username (Email)</label>
            <input type="email" id="newUsername" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
          </div>
          <div>
            <label htmlFor="newName" className="block text-sm font-medium text-gray-700">Full Name</label>
            <input type="text" id="newName" value={newName} onChange={(e) => setNewName(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
          </div>
          <div>
            <label htmlFor="newRole" className="block text-sm font-medium text-gray-700">Role</label>
            <select 
              id="newRole" 
              value={selectedRole} 
              onChange={(e) => setSelectedRole(e.target.value)} 
              className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
            >
              <option value="Field Worker">Field Worker</option>
              <option value="Foreman">Foreman</option>
              <option value="Admin">Admin</option>
              <option value={ADD_NEW_ROLE_VALUE}>-- Add New Role --</option>
            </select>
          </div>
          {selectedRole === ADD_NEW_ROLE_VALUE && (
            <div>
              <label htmlFor="customRoleName" className="block text-sm font-medium text-gray-700">Custom Role Name</label>
              <input 
                type="text" 
                id="customRoleName" 
                value={customRoleName} 
                onChange={(e) => setCustomRoleName(e.target.value)} 
                required 
                placeholder="Enter new role name"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" 
              />
            </div>
          )}
          <Button type="submit" isLoading={isSubmitting} variant="primary">Create User</Button>
        </form>
      </div>

      <div className="bg-white shadow-xl rounded-lg overflow-x-auto">
        <h3 className="text-xl font-semibold p-4 border-b text-gray-700">Existing Users</h3>
        {users.length === 0 && !error ? (
          <p className="p-4 text-gray-500">No users found.</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username (Email)</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map(user => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.username}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.role}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <Button onClick={() => handleResetPassword(user)} variant="ghost" size="sm" disabled={isSubmitting}>Reset Password</Button>
                    {/* 
                      User Deletion button removed. 
                      Securely deleting a Firebase user requires admin privileges which are not available in the client-side SDK.
                      This action should be handled by a trusted backend environment, like a Firebase Cloud Function.
                    */}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
    </>
  );
};