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
  declare userId: string;

  @Column({
    allowNull: false,
  })
  declare deviceFingerprint: string;

  @Column({
    allowNull: false,
  })
  declare userAgent: string;

  @Default(true)
  @Column
  declare isActive: boolean;

  @Default(DataType.NOW)
  @Column
  declare lastActiveAt: Date;
}
