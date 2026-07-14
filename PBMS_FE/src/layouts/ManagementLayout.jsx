// src/layouts/ManagementLayout.jsx
import { Outlet } from 'react-router-dom';
// import Sidebar from '../components/common/Sidebar'; // Connect when complete

const ManagementLayout = () => {
  return (
    <div className="">
      <main className="">
        <Outlet />
      </main>
    </div>
  );
};

export default ManagementLayout;