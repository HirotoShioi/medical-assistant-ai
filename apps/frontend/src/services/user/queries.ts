import { useQuery } from "@tanstack/react-query";
import { getUserPreferences } from "./service";

export const useUserPreferencesQuery = () => {
  return useQuery({
    queryKey: ["userPreferences"],
    queryFn: getUserPreferences,
  });
};
