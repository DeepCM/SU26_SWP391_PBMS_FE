// src/layouts/DriverLayout.jsx
import { Outlet } from 'react-router-dom';


const DriverLayout = () => {
  return (
    <div className="">
      <main className="">
        <Outlet /> {/* Target pages render here */}
      </main>
    </div>
  );
};

export default DriverLayout;