import useSWR from 'swr';
import api from '@/lib/api';

const fetcher = (url: string) => api.get(url).then(res => res.data);

export default function usePlanLimits() {
    const { data: familySettings, error, isLoading } = useSWR('/family/settings', fetcher);

    const plan = familySettings?.Plan || familySettings?.plan || 'FREE';
    const isPremium = plan !== 'FREE';

    return {
        plan,
        isPremium,
        isLoading,
        error,
        maxChildren: isPremium ? Infinity : 2,
        features: {
            leaderboard: isPremium,
            maxCustomTasks: isPremium ? Infinity : 10,
            maxRewards: isPremium ? Infinity : 5,
        }
    };
}
