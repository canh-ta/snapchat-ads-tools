import Link from 'next/link';
import { signIn, signOut, useSession } from 'next-auth/react';

const menu: { link: string; title: string }[] = [
  {
    title: 'Home',
    link: '/',
  },
  {
    title: 'Ad Accounts',
    link: '/organizations/adaccounts',
  },
  {
    title: 'API',
    link: '/swagger',
  },
  {
    title: 'Me',
    link: '/me',
  },
];

export default function Header() {
  const { data: session } = useSession();

  const onSignIn = (e: any): void => {
    e.preventDefault();
    signIn();
  };

  const onSignOut = (e: any): void => {
    e.preventDefault();
    signOut();
  };

  return (
    <div className="navbar bg-neutral text-neutral-content">
      <div className="navbar-start">
        <div className="dropdown">
          <label tabIndex={0} className="btn btn-ghost lg:hidden">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" />
            </svg>
          </label>
          <ul tabIndex={0} className="menu menu-compact dropdown-content mt-3 p-2 shadow bg-base-100 rounded-box w-52">
            {menu.map(({ link, title }) => (
              <li key={link}>
                <Link href={link}>{title}</Link>
              </li>
            ))}
          </ul>
        </div>
        <a className="btn btn-ghost normal-case text-xl">Crishub</a>
      </div>
      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1">
          {menu.map(({ link, title }) => (
            <li key={link}>
              <Link href={link}>{title}</Link>
            </li>
          ))}
        </ul>
      </div>
      <div className="navbar-end">
        {!session && (
          <button className="btn" onClick={onSignIn}>
            Sign in
          </button>
        )}
        {session?.user && (
          <div className="dropdown dropdown-end">
            <label tabIndex={0} className="btn btn-active bt-sm normal-case text-md gap-2">
              {session.user.email ?? session.user.name}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </label>
            <ul
              tabIndex={0}
              className="mt-3 p-2 shadow menu menu-compact dropdown-content bg-base-100 text-neutral rounded-box w-52"
            >
              <li>
                <a className="justify-between">
                  Profile
                  <span className="badge">New</span>
                </a>
              </li>
              <li>
                <a onClick={onSignOut}>Logout</a>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
