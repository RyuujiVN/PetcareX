import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ForumComment } from './forum_comment.entity';
import { User } from 'src/user/entities/user.entity';
import { ForumTopic } from './forum_topic.entity';

@Entity('forum_post')
export class ForumPost {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'author_id' })
  authorId: string;

  @Column({ type: 'uuid', name: 'topic_id' })
  topicId: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'int', name: 'comment_count', default: 0 })
  commentCount: number;

  @Column({ type: 'int', name: 'like_count', default: 0 })
  likeCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => ForumComment, (comment) => comment.post)
  comments: ForumComment[];

  @ManyToOne(() => User, (user) => user.posts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'author_id' })
  author: User;

  @ManyToOne(() => ForumTopic, (topic) => topic.posts, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'topic_id' })
  topic: ForumTopic;
}
