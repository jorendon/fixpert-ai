import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface YoutubeVideoResult {
  videoId: string;
  title: string;
  thumbnailUrl: string;
  channelTitle: string;
  url: string;
}

@Injectable()
export class YoutubeService {
  private readonly logger = new Logger(YoutubeService.name);
  private readonly apiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('YOUTUBE_API_KEY') || '';
  }

  async searchTutorials(keywords: string[]): Promise<YoutubeVideoResult[]> {
    if (!this.apiKey || keywords.length === 0) {
      return [];
    }

    try {
      const query = encodeURIComponent(keywords.slice(0, 2).join(' '));
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=3&q=${query}&key=${this.apiKey}`;

      const response = await fetch(url);
      if (!response.ok) {
        this.logger.warn(`YouTube API respondió con estado ${response.status}`);
        return [];
      }

      const data = await response.json();
      return (data.items || []).map((item: any) => ({
        videoId: item.id.videoId,
        title: item.snippet.title,
        thumbnailUrl: item.snippet.thumbnails?.medium?.url || '',
        channelTitle: item.snippet.channelTitle,
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      }));
    } catch (error) {
      this.logger.error('Error buscando tutoriales en YouTube', error);
      return [];
    }
  }
}
