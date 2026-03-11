import { User } from 'src/user/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ForumPost } from './forum_post.entity';

@Entity('forum_comment')
export class ForumComment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'uuid', name: 'post_id' })
  postId: string;

  @Column({ type: 'uuid', name: 'parent_id', nullable: true })
  parentId?: string;

  @Column({ type: 'text' })
  content: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.comments, {
    onDelete: 'CASCADE',
  })
  user: User;

  @ManyToOne(() => ForumPost, (post) => post.comments, {
    onDelete: 'CASCADE',
  })
  post: ForumPost;

  @ManyToOne(() => ForumComment, (comment) => comment.replies, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'parent_id' })
  parent: ForumComment;

  @OneToMany(() => ForumComment, (comment) => comment.parent)
  replies: ForumComment[];
}
