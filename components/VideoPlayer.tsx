import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Play, Pause, RotateCcw, RotateCw, X } from 'lucide-react-native';
import { Slider } from '@miblanchard/react-native-slider';

interface VideoPlayerProps {
    videoUrl: string;
    onClose: () => void;
    onProgressUpdate?: (seconds: number) => void;
    initialPosition?: number;
}

const { width } = Dimensions.get('window');

const VideoPlayer: React.FC<VideoPlayerProps> = ({
    videoUrl,
    onClose,
    onProgressUpdate,
    initialPosition = 0
}) => {
    const player = useVideoPlayer(videoUrl, (player) => {
        player.loop = false;
        if (initialPosition > 0) {
            player.seekBy(initialPosition);
        }
    });

    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [showControls, setShowControls] = useState(true);

    // Auto-sync progress every 10 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            if (player.playing && onProgressUpdate) {
                onProgressUpdate(player.currentTime);
            }
        }, 10000);

        return () => clearInterval(interval);
    }, [player.playing]);

    const togglePlayback = () => {
        if (player.playing) {
            player.pause();
        } else {
            player.play();
        }
    };

    const skipForward = () => player.seekBy(10);
    const skipBackward = () => player.seekBy(-10);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <View style={styles.container}>
            <VideoView
                player={player}
                style={styles.video}
                contentFit="contain"
                allowsFullscreen
                allowsPictureInPicture
            />

            {showControls && (
                <View style={styles.overlay}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <X color="#fff" size={24} />
                        </TouchableOpacity>
                    </View>

                    {/* Center Controls */}
                    <View style={styles.centerControls}>
                        <TouchableOpacity onPress={skipBackward}>
                            <RotateCcw color="#fff" size={32} />
                        </TouchableOpacity>

                        <TouchableOpacity onPress={togglePlayback} style={styles.playButton}>
                            {player.playing ? <Pause color="#fff" size={48} /> : <Play color="#fff" size={48} />}
                        </TouchableOpacity>

                        <TouchableOpacity onPress={skipForward}>
                            <RotateCw color="#fff" size={32} />
                        </TouchableOpacity>
                    </View>

                    {/* Footer / Progress */}
                    <View style={styles.footer}>
                        <View style={styles.timeRow}>
                            <Text style={styles.timeText}>{formatTime(player.currentTime)}</Text>
                            <Text style={styles.timeText}>{formatTime(player.duration)}</Text>
                        </View>
                        <Slider
                            value={player.currentTime}
                            minimumValue={0}
                            maximumValue={player.duration}
                            onSlidingComplete={(value) => player.seekBy(Array.isArray(value) ? value[0] : value)}
                            minimumTrackTintColor="#7C4DFF"
                            maximumTrackTintColor="rgba(255,255,255,0.3)"
                            thumbTintColor="#7C4DFF"
                        />
                    </View>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    video: {
        flex: 1,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'space-between',
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    closeButton: {
        padding: 10,
    },
    centerControls: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 40,
    },
    playButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(124, 77, 255, 0.6)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    footer: {
        width: '100%',
    },
    timeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    timeText: {
        color: '#fff',
        fontSize: 12,
        fontFamily: 'Inter-Medium',
    }
});

export default VideoPlayer;
