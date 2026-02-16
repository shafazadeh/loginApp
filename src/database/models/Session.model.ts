import { Table, Column, Model, DataType, Default } from 'sequelize-typescript';

@Table({
  tableName: 'sessions',
  timestamps: true,
})
export class Session extends Model {
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    defaultValue: DataType.UUIDV4,
  })
  declare id?: string;

  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  userId: string;

  @Column({
    allowNull: false,
  })
  deviceId: string;

  @Column
  ip: string;

  @Column
  userAgent: string;

  @Default(true)
  @Column
  isActive: boolean;

  @Default(DataType.NOW)
  @Column
  lastActiveAt: Date;
}
