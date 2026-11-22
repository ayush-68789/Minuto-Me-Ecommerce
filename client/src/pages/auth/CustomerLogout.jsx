import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

export default function CustomerLogout() {
  const { slug } = useParams();
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) { navigate(`/store/${slug}`, { replace: true }); return; }
    if (user.role !== 'customer') { navigate(`/store/${slug}`, { replace: true }); return; }
    logout().finally(() => navigate(`/store/${slug}`, { replace: true }));
  }, [logout, navigate, slug, user]);

  return <main style={{ padding: 32 }}>Logging out…</main>;
}
