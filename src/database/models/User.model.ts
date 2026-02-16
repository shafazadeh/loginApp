import { Table, Column, Model, DataType } from 'sequelize-typescript';

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

@Table({
  tableName: 'users',
  timestamps: true,
})
export class User extends Model {
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    defaultValue: DataType.UUIDV4,
  })
  declare id?: string;

  @Column({
    type: DataType.STRING,
    unique: true,
    allowNull: false,
  })
  email: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  password: string;

  @Column({
    type: DataType.ENUM('USER', 'ADMIN'),
    defaultValue: 'USER',
  })
  role: UserRole;
}
