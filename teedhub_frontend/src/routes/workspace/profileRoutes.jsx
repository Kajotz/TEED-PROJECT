import ProfileOverview from "@/pages/workspace/profile/ProfileOverview";
import ProfileDetails from "@/pages/workspace/profile/ProfileDetails";
import ProfileEdit from "@/pages/workspace/profile/ProfileEdit";

export const profileRoutes = [
  {
    path: "profile",
    handle: { title: "Business Profile" },
    children: [
      {
        index: true,
        element: <ProfileOverview />,
        handle: { title: "Business Profile" },
      },
      {
        path: "details",
        element: <ProfileDetails />,
        handle: { title: "Business Profile Details" },
      },
      {
        path: "edit",
        element: <ProfileEdit />,
        handle: { title: "Business Profile Edit" },
      },
    ],
  },
];