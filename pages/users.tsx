"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlusIcon, SearchIcon, PencilIcon, MailIcon, XIcon, ImageIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";
interface UsersProps {
  isUsersMiddleChatVisible?: boolean;
  setIsUsersMiddleChatVisible?: (value: boolean) => void;
}

interface User {
  id: number;
  avatar: string;
  name: string;
  email: string;
  plan: "Free" | "Pro";
  dateCreated: string;
}

const mockUsers: User[] = [
  {
    id: 1,
    avatar: "https://i.pravatar.cc/150?u=sarah.thompson@example.com",
    name: "Sarah Thompson",
    email: "sarah.thompson@example.com",
    plan: "Pro",
    dateCreated: "Dec 15, 2025",
  },
  {
    id: 2,
    avatar: "https://i.pravatar.cc/150?u=michael.chen@example.com",
    name: "Michael Chen",
    email: "michael.chen@example.com",
    plan: "Pro",
    dateCreated: "Dec 12, 2025",
  },
  {
    id: 3,
    avatar: "https://i.pravatar.cc/150?u=emma.wilson@example.com",
    name: "Emma Wilson",
    email: "emma.wilson@example.com",
    plan: "Free",
    dateCreated: "Dec 10, 2025",
  },
  {
    id: 4,
    avatar: "https://i.pravatar.cc/150?u=carlos.rodriguez@example.com",
    name: "Carlos Rodriguez",
    email: "carlos.rodriguez@example.com",
    plan: "Pro",
    dateCreated: "Dec 8, 2025",
  },
  {
    id: 5,
    avatar: "https://i.pravatar.cc/150?u=yuki.tanaka@example.com",
    name: "Yuki Tanaka",
    email: "yuki.tanaka@example.com",
    plan: "Free",
    dateCreated: "Dec 5, 2025",
  },
  {
    id: 6,
    avatar: "https://i.pravatar.cc/150?u=sophie.dubois@example.com",
    name: "Sophie Dubois",
    email: "sophie.dubois@example.com",
    plan: "Pro",
    dateCreated: "Dec 3, 2025",
  },
  {
    id: 7,
    avatar: "https://i.pravatar.cc/150?u=james.mitchell@example.com",
    name: "James Mitchell",
    email: "james.mitchell@example.com",
    plan: "Pro",
    dateCreated: "Dec 1, 2025",
  },
  {
    id: 8,
    avatar: "https://i.pravatar.cc/150?u=priya.sharma@example.com",
    name: "Priya Sharma",
    email: "priya.sharma@example.com",
    plan: "Free",
    dateCreated: "Nov 28, 2025",
  },
  {
    id: 9,
    avatar: "https://i.pravatar.cc/150?u=david.martinez@example.com",
    name: "David Martinez",
    email: "david.martinez@example.com",
    plan: "Pro",
    dateCreated: "Nov 25, 2025",
  },
  {
    id: 10,
    avatar: "https://i.pravatar.cc/150?u=lisa.anderson@example.com",
    name: "Lisa Anderson",
    email: "lisa.anderson@example.com",
    plan: "Free",
    dateCreated: "Nov 22, 2025",
  },
];

export default function Users({ isUsersMiddleChatVisible = false, setIsUsersMiddleChatVisible }: UsersProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    plan: "Free" as "Free" | "Pro",
    avatar: "",
  });

  const filteredUsers = mockUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddUser = () => {
    // Handle user creation here
    console.log("Adding user:", newUser);
    setIsDrawerOpen(false);
    setNewUser({ name: "", email: "", plan: "Free", avatar: "" });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewUser({ ...newUser, avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <>
      <div className='w-full sticky top-0 z-50 bg-white dark:bg-neutral-950 flex-shrink-0 flex flex-row h-16 items-center px-8 border-b border-neutral-200 dark:border-neutral-800'>
        <h1 className='text-lg font-bold'>Users</h1>
        <div className="ml-4 flex gap-2">
          <Badge variant="outline" className="text-xs">
            {mockUsers.length} Users
          </Badge>
          <Badge variant="outline" className="text-xs">
            {mockUsers.filter(u => u.plan === "Pro").length} Pro Users
          </Badge>
        </div>
        <div className="ml-auto flex gap-2">
          <Button size="sm" onClick={() => setIsDrawerOpen(true)}>
            <PlusIcon className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      <div className="max-w-5xl w-full mx-auto flex-1 p-4 md:p-8">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11"
            />
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Showing {filteredUsers.length} of {mockUsers.length} users
          </p>
        </div>

        {/* Desktop Table - Hidden on Mobile */}
        <div className="hidden md:block rounded-lg w-full border border-neutral-200 dark:border-neutral-800">
          <Table className="w-full">
            <TableHeader>
              <TableRow className="bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-900">
                <TableHead className="w-[80px]">Avatar</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Date Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    No users found matching your search.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50">
                    <TableCell>
                      <Avatar>
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback>
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell>
                      <p className="font-semibold text-sm">{user.name}</p>
                    </TableCell>
                    <TableCell className="text-sm">{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.plan === "Pro" ? "default" : "outline"} className="text-xs">
                        {user.plan}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{user.dateCreated}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 cursor-pointer"
                              aria-label="Edit user"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Edit</p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 cursor-pointer"
                              aria-label="Contact user"
                              onClick={() => window.location.href = `mailto:${user.email}`}
                            >
                              <MailIcon className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Send email</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Cards - Hidden on Desktop */}
        <div className="md:hidden space-y-2">
          {filteredUsers.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              No users found matching your search.
            </Card>
          ) : (
            filteredUsers.map((user) => (
              <Card key={user.id} className="p-4 border-none">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <Avatar className="w-12 h-12 flex-shrink-0">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>
                      {user.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-sm truncate">{user.name}</h3>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                      <Badge variant={user.plan === "Pro" ? "default" : "outline"} className="text-xs flex-shrink-0">
                        {user.plan}
                      </Badge>
                    </div>

                    {/* Date and Actions */}
                    <div className="flex items-center justify-between mt-3">
                      <p className="text-xs text-muted-foreground">{user.dateCreated}</p>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          aria-label="Edit user"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          aria-label="Contact user"
                          onClick={() => window.location.href = `mailto:${user.email}`}
                        >
                          <MailIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Drawer for adding user */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setIsDrawerOpen(false)}
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-full md:w-[400px] bg-white dark:bg-neutral-950 shadow-xl z-50 border-l border-neutral-200 dark:border-neutral-800 flex flex-col">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-800">
              <h2 className="text-lg font-semibold">Add New User</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsDrawerOpen(false)}
              >
                <XIcon className="w-4 h-4" />
              </Button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="space-y-4">
                {/* Avatar Upload */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Profile Picture</label>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Avatar className="w-20 h-20">
                        {newUser.avatar ? (
                          <AvatarImage src={newUser.avatar} alt="Preview" />
                        ) : (
                          <AvatarFallback className="bg-neutral-100 dark:bg-neutral-800">
                            <ImageIcon className="w-8 h-8 text-muted-foreground" />
                          </AvatarFallback>
                        )}
                      </Avatar>
                    </div>
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                        id="avatar-upload"
                      />
                      <label htmlFor="avatar-upload">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="cursor-pointer"
                          onClick={() => document.getElementById('avatar-upload')?.click()}
                        >
                          Choose Image
                        </Button>
                      </label>
                      <p className="text-xs text-muted-foreground mt-2">
                        JPG, PNG or GIF. Max 2MB.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Name</label>
                  <Input
                    type="text"
                    placeholder="Enter user name"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Email</label>
                  <Input
                    type="email"
                    placeholder="Enter user email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Plan</label>
                  <div className="flex gap-2">
                    <Button
                      variant={newUser.plan === "Free" ? "default" : "outline"}
                      className="flex-1"
                      onClick={() => setNewUser({ ...newUser, plan: "Free" })}
                    >
                      Free
                    </Button>
                    <Button
                      variant={newUser.plan === "Pro" ? "default" : "outline"}
                      className="flex-1"
                      onClick={() => setNewUser({ ...newUser, plan: "Pro" })}
                    >
                      Pro
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-6 border-t border-neutral-200 dark:border-neutral-800 flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setIsDrawerOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleAddUser}
                disabled={!newUser.name || !newUser.email}
              >
                Add User
              </Button>
            </div>
          </motion.div>
        </>
      )}
      </AnimatePresence>

    </>
  );
}
