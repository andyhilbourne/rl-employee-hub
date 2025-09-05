import React, { useState, useEffect, useCallback } from 'react';
import { User } from '../../types';
import { userService } from '../../services/userService';
import { Button } from '../Button';
import { LoadingSpinner } from '../LoadingSpinner';
import { UsersIcon, XMarkIcon, Cog6ToothIcon } from '../icons';

const ADD_NEW_ROLE_VALUE = "-- Add New Role --";

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

  // State for webhook modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [webhookUrlInput, setWebhookUrlInput] = useState('');
  const [isSavingWebhook, setIsSavingWebhook] = useState(false);


  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedUsers = await userService.getAllUsers();
      setUsers(fetchedUsers);
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
  
  const openWebhookModal = (user: User) => {
    setEditingUser(user);
    setWebhookUrlInput(user.webhookUrl || '');
    setIsModalOpen(true);
    setError(null);
    setSubmitMessage(null);
  };

  const handleSaveWebhook = async () => {
    if (!editingUser) return;
    setIsSavingWebhook(true);
    setError(null);
    try {
      await userService.updateUser(editingUser.id, { webhookUrl: webhookUrlInput });
      setSubmitMessage(`Webhook for ${editingUser.name} updated successfully.`);
      setIsModalOpen(false);
      setEditingUser(null);
      fetchUsers(); // Refresh the user list to show updated data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save webhook.');
    } finally {
      setIsSavingWebhook(false);
    }
  };


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

    try {
      await userService.createUser({ username: newUsername, name: newName, role: roleToSave });
      setSubmitMessage(`User "${newUsername}" with role "${roleToSave}" created successfully. A default password has been assigned.`);
      setNewUsername('');
      setNewName('');
      setSelectedRole('Field Worker');
      setCustomRoleName('');
      fetchUsers(); // Refresh the list
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create user.';
      setError(errorMessage);
      setSubmitMessage(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><LoadingSpinner /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center text-gray-700 mb-6 pb-2 border-b-2 border-teal-500">
        <UsersIcon className="w-8 h-8 mr-3 text-teal-600" />
        <h2 className="text-3xl font-bold">User Management</h2>
      </div>
      
      {submitMessage && <p className="text-sm text-green-600 bg-green-50 p-3 rounded-md">{submitMessage}</p>}
      {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</p>}


      {/* Create User Form */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4 text-gray-700">Create New User</h3>
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div>
            <label htmlFor="newUsername" className="block text-sm font-medium text-gray-700">Username</label>
            <input type="text" id="newUsername" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
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

      {/* Users List */}
      <div className="bg-white shadow-xl rounded-lg overflow-x-auto">
        <h3 className="text-xl font-semibold p-4 border-b text-gray-700">Existing Users</h3>
        {users.length === 0 && !error ? (
          <p className="p-4 text-gray-500">No users found.</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Webhook Status</th>
                <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map(user => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.username}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.role}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.webhookUrl 
                        ? <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Configured</span>
                        : <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">Not Set</span>
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button onClick={() => openWebhookModal(user)} variant="ghost" size="sm" leftIcon={<Cog6ToothIcon className="w-4 h-4" />}>
                        Manage Webhook
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Webhook Modal */}
      {isModalOpen && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" aria-modal="true" role="dialog">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg m-4">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-800">Webhook for {editingUser.name}</h3>
                    <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-full text-gray-500 hover:bg-gray-200 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Enter the webhook URL to automatically send this user's timesheets to a service like Zapier or Make.com. Leave blank to disable automation.
                    </p>
                    <div>
                        <label htmlFor="webhookUrlInput" className="block text-sm font-medium text-gray-700">Webhook URL</label>
                        <input
                            type="url"
                            id="webhookUrlInput"
                            value={webhookUrlInput}
                            onChange={(e) => setWebhookUrlInput(e.target.value)}
                            placeholder="https://hooks.example.com/..."
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                    </div>
                    {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded-md">{error}</p>}
                    <div className="flex justify-end items-center space-x-3 pt-4">
                        <Button onClick={() => setIsModalOpen(false)} variant="secondary" disabled={isSavingWebhook}>Cancel</Button>
                        <Button onClick={handleSaveWebhook} variant="primary" isLoading={isSavingWebhook}>Save Webhook</Button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};