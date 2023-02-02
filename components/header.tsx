import Link from 'next/link';
import { signIn, signOut, useSession } from 'next-auth/react';
import themes from '@configs/theme';

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
    <header>
      <div className="flex items-center justify-between opacity-100 overflow-hidden bg-stone-300 p-2 rounded-b-lg">
        <nav>
          <ul>
            {menu.map(({ link, title }) => (
              <li key={link} className="bg-stone-400 hover:bg-stone-500 px-2 py-1 rounded-md inline-block mr-2">
                <Link href={link}>{title}</Link>
              </li>
            ))}
          </ul>
        </nav>
        {!session && (
          <button className={themes.button.primary} onClick={onSignIn}>
            Sign in
          </button>
        )}
        {session?.user && (
          <span className="flex items-center justify-between gap-2">
            <i>{session.user.email ?? session.user.name}</i>
            <button className={themes.button.primary} onClick={onSignOut}>
              Sign out
            </button>
          </span>
        )}
      </div>
    </header>
  );
}
