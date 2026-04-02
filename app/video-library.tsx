import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { Play, Clock } from 'lucide-react-native';
import { supabase } from '../services/supabase';

const CATEGORIES = [
    { id: 'all', label: 'All Sessions' },
    { id: 'meditation', label: 'Meditation' },
    { id: 'breathing', label: 'Breathing' },
    { id: 'educational', label: 'Resources' },
    { id: 'therapy', label: 'Therapy' },
];

const VideoLibrary = () => {
    const router = useRouter();
    const [videos, setVideos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('all');

    useEffect(() => {
        fetchVideos();
    }, [selectedCategory]);

    const fetchVideos = async () => {
        setLoading(true);
        try {
            let query = supabase.from('video_sessions').select('*');
            if (selectedCategory !== 'all') {
                query = query.eq('category', selectedCategory);
            }

            const { data, error } = await query.order('created_at', { ascending: false });
            if (error) throw error;
            setVideos(data || []);
        } catch (error) {
            console.error('Error fetching videos:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderVideoItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/video-session/${item.id}`)}
        >
            <Image source={{ uri: item.thumbnail_url }} style={styles.thumbnail} />
            <View style={styles.playOverlay}>
                <Play color="#fff" size={24} fill="#fff" />
            </View>
            <View style={styles.cardContent}>
                <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
                <View style={styles.meta}>
                    <Clock size={14} color="#666" />
                    <Text style={styles.duration}>{Math.round(item.duration_seconds / 60)} mins</Text>
                    <Text style={styles.categoryBadge}>{item.category}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Video Library</Text>

            <View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryList}>
                    {CATEGORIES.map(cat => (
                        <TouchableOpacity
                            key={cat.id}
                            onPress={() => setSelectedCategory(cat.id)}
                            style={[
                                styles.categoryTab,
                                selectedCategory === cat.id && styles.categoryTabActive
                            ]}
                        >
                            <Text style={[
                                styles.categoryText,
                                selectedCategory === cat.id && styles.categoryTextActive
                            ]}>
                                {cat.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#7C4DFF" style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={videos}
                    renderItem={renderVideoItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    numColumns={2}
                    columnWrapperStyle={styles.columnWrapper}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
        paddingTop: 60,
    },
    header: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1A1A1A',
        paddingHorizontal: 20,
        marginBottom: 20,
        fontFamily: 'Inter-Bold',
    },
    categoryList: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    categoryTab: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#fff',
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#EEE',
    },
    categoryTabActive: {
        backgroundColor: '#7C4DFF',
        borderColor: '#7C4DFF',
    },
    categoryText: {
        color: '#666',
        fontSize: 14,
        fontFamily: 'Inter-Medium',
    },
    categoryTextActive: {
        color: '#fff',
    },
    listContent: {
        paddingHorizontal: 15,
        paddingBottom: 30,
    },
    columnWrapper: {
        justifyContent: 'space-between',
    },
    card: {
        width: '48%',
        backgroundColor: '#fff',
        borderRadius: 16,
        marginBottom: 15,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    thumbnail: {
        width: '100%',
        height: 120,
        backgroundColor: '#DDD',
    },
    playOverlay: {
        position: 'absolute',
        top: 40,
        left: '50%',
        marginLeft: -20,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardContent: {
        padding: 12,
    },
    title: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1A1A1A',
        marginBottom: 8,
        fontFamily: 'Inter-SemiBold',
        height: 34,
    },
    meta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    duration: {
        fontSize: 12,
        color: '#666',
        fontFamily: 'Inter-Regular',
    },
    categoryBadge: {
        fontSize: 10,
        color: '#7C4DFF',
        backgroundColor: '#F0E6FF',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginLeft: 'auto',
        textTransform: 'capitalize',
    }
});

export default VideoLibrary;
