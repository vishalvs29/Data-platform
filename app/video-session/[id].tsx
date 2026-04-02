import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import VideoPlayer from '../../components/VideoPlayer';
import { supabase } from '../../services/supabase';

const VideoSessionScreen = () => {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [video, setVideo] = useState<any>(null);
    const [initialPosition, setInitialPosition] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSession();
    }, [id]);

    const loadSession = async () => {
        try {
            // 1. Load Video Metadata
            const { data: videoData, error: vError } = await supabase
                .from('video_sessions')
                .select('*')
                .eq('id', id)
                .single();

            if (vError) throw vError;
            setVideo(videoData);

            // 2. Load User Progress
            const { data: progress } = await supabase
                .from('video_progress')
                .select('last_position_seconds')
                .eq('video_id', id)
                .single();

            if (progress) {
                setInitialPosition(progress.last_position_seconds);
            }
        } catch (error) {
            console.error('Error loading session:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleProgressUpdate = async (seconds: number) => {
        try {
            // In a real app, userId would come from a session/auth context
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            await supabase.from('video_progress').upsert({
                user_id: user.id,
                video_id: id,
                last_position_seconds: Math.floor(seconds),
                is_completed: seconds >= (video?.duration_seconds - 10),
                updated_at: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error syncing progress:', error);
        }
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#7C4DFF" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <VideoPlayer
                videoUrl={video.url}
                initialPosition={initialPosition}
                onProgressUpdate={handleProgressUpdate}
                onClose={() => router.back()}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
    }
});

export default VideoSessionScreen;
