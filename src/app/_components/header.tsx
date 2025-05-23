import Link from "next/link";
import { User } from "lucide-react";
import { ThemeToggle } from "~/app/_components/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { auth } from "~/server/auth";
import { Button } from "~/components/ui/button";

const Header = async () => {
  return (
    <header className="sticky top-0 border-b border-b-border">
      <div className="container mx-auto flex h-14 items-center border-x border-x-border bg-background px-4">
        <div className="flex">
          <Link href="/">Loot List</Link>
        </div>
        <div className="flex flex-1 items-center justify-end gap-4">
          <ThemeToggle />
          <UserAvatar />
        </div>
      </div>
    </header>
  );
};

const UserAvatar = async () => {
  const session = await auth();
  return (
    <Link href={session ? "/api/auth/signout" : "/api/auth/signin"}>
      {session ? (
        <Avatar>
          <AvatarImage src={session.user.image!} alt={session.user.name!} />
          <AvatarFallback>{getInitals(session.user.name!)}</AvatarFallback>
        </Avatar>
      ) : (
        <Button variant="ghost">
          <User />
        </Button>
      )}
    </Link>
  );
};

const getInitals = (name: string) => {
  const splitName = name.split(" ");
  return `${splitName[0]?.substring(0,1)?.toUpperCase()}${splitName[1] ? splitName[1].substring(0,1).toUpperCase() : ""}`;
};

export { Header };
