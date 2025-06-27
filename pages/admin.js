import { getIronSession } from 'iron-session';
import { sessionOptions } from '../lib/session';
import Layout from '../components/Layout';
import AdminDashboard from '../components/AdminDashboard';

export default function AdminPage({ user }) {
  return (
    <Layout user={user}>
      <AdminDashboard />
    </Layout>
  );
}

export const getServerSideProps = async ({ req, res }) => {
  const session = await getIronSession(req, res, sessionOptions);
  const { user } = session;

  if (!user || user.role !== 'admin') {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  return {
    props: { user },
  };
};
