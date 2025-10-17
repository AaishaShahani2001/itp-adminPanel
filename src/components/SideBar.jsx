import React from 'react'
import { useAdminContext } from '../context/AdminContext'
import { useCaretakerContext } from '../context/CaretakerContex';
import { NavLink, useLocation } from 'react-router-dom';
import { adminMenuLinks, caretakerMenuLinks } from '../assets/assets';

const SideBar = () => {
  const { aToken } = useAdminContext();
  const { cToken } = useCaretakerContext();

  const location = useLocation();

  const menuLinks = aToken ? adminMenuLinks : cToken ? caretakerMenuLinks : [];

  return (
    <div className='w-80 pt-50 min-h-screen bg-white border-r'>
      {(aToken || cToken) && (
        <ul>
          <div>
            {menuLinks.map((link, index) => {
              const isActive = location.pathname.startsWith(link.path);

              return (
                <NavLink
                  key={index}
                  to={link.path}
                  className={`relative flex items-center gap-2 w-full px-5 py-3 pl-4 first:mt-6 ${
                    isActive ? 'bg-primary/10 text-primary' : 'text-gray-600'
                  }`}
                  end={false}
                >
                  <img src={isActive ? link.coloredIcon : link.icon} alt="" />
                  <span>{link.name}</span>

                  <div
                    className={`${
                      isActive ? 'bg-primary' : ''
                    } w-1.5 h-8 rounded-1 right-0 absolute`}
                  ></div>
                </NavLink>
              );
            })}
          </div>
        </ul>
      )}
    </div>
  );
};

export default SideBar;
