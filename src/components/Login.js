// Login.js
import React from 'react';
import { useAccount } from '../Account'; // Sesuaikan path-nya

export default function Login() {
  const { user, login, logout } = useAccount();

  return (
    <div>
      {user ? (
        <div>
          <p>Selamat datang, {user.name}!</p>
          <img src={user.picture} alt="Profil" style={{ width: '50px', borderRadius: '50%' }} />
          <p>{user.email}</p>
          <button onClick={logout}>Logout</button>
        </div>
      ) : (
        <button onClick={login}>
          Login dengan Google
        </button>
      )}
    </div>
  );
}

