// src/components/Profile.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import DataTableComponent from './DataTableComponent';


const Profile = () => {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('http://localhost:5000/me', {
                    headers: { 'x-access-token': token }
                });
                setUser(response.data);
            } catch (error) {
                alert('Failed to fetch profile');
            }
        };

        fetchProfile();
    }, []);

    return (
        <div className="p-7 m-5 bg-white h-full rounded-lg">
            <h1 className="text-4xl font-bold mb-4">Konsesi</h1>
            <DataTableComponent />
        </div>
        
    );
};

export default Profile;
