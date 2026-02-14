import { useCallback, useEffect, useState } from 'react';
import { getLiveBeerLogPreference, setLiveBeerLogPreference } from '@/utils/beerLogPreferences';

export const useLiveBeerLogPreference = () => {
    const [enabled, setEnabled] = useState(false);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        getLiveBeerLogPreference().then((value) => {
            setEnabled(value);
            setLoaded(true);
        });
    }, []);

    const toggle = useCallback(async (value: boolean) => {
        setEnabled(value);
        await setLiveBeerLogPreference(value);
    }, []);

    return { enabled, loaded, toggle };
};
