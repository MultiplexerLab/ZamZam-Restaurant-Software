import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Profile = () => {
    const { user } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || ''
    });

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleSave = () => {
        // Here you would typically make an API call to update the user
        console.log('Saving profile:', formData);
        setIsEditing(false);
        // Add your API call here
    };

    const handleCancel = () => {
        setFormData({
            name: user?.name || '',
            email: user?.email || ''
        });
        setIsEditing(false);
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    return (
        <div style={{ maxWidth: '600px', margin: '50px auto', padding: '20px' }}>
            <h2>User Profile</h2>
            <div style={{ background: '#f5f5f5', padding: '20px', borderRadius: '8px' }}>
                {isEditing ? (
                    <div>
                        <div style={{ marginBottom: '15px' }}>
                            <label>Name:</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                            />
                        </div>
                        <div style={{ marginBottom: '15px' }}>
                            <label>Email:</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                            />
                        </div>
                        <div>
                            <button onClick={handleSave} style={{ marginRight: '10px' }}>
                                Save
                            </button>
                            <button onClick={handleCancel}>
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <div>
                        <p><strong>Name:</strong> {user?.name}</p>
                        <p><strong>Email:</strong> {user?.email}</p>
                        <p><strong>Member since:</strong> {new Date(user?.created_at).toLocaleDateString()}</p>
                        <button onClick={handleEdit} style={{ marginTop: '15px' }}>
                            Edit Profile
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Profile;