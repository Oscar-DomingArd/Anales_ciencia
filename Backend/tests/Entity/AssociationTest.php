<?php

namespace TDW\Test\ACiencia\Entity;

use Faker\Generator;
use PHPUnit\Framework\Attributes as TestsAttr;
use PHPUnit\Framework\TestCase;
use TDW\ACiencia\Entity\{ Element, Association };
use TDW\ACiencia\Factory;
use function PHPUnit\Framework\assertNotEmpty;

/**
 * Class AssociationTest
 */
#[TestsAttr\Group('entities')]
#[TestsAttr\CoversClass(Association::class)]
#[TestsAttr\CoversClass(Element::class)]
#[TestsAttr\CoversClass(Factory\AssociationFactory::class)]
#[TestsAttr\UsesClass(Factory\EntityFactory::class)]
class AssociationTest extends TestCase
{
    protected static Association $association;
    private static Generator $faker;

    public static function setUpBeforeClass(): void
    {
        self::$faker    = \Faker\Factory::create('es_ES');
        $name           = self::$faker->name();
        $website        = self::$faker->url();
        assertNotEmpty($name);
        assertNotEmpty($website);
        self::$association = Factory\AssociationFactory::createAssociation(
            $name,
            $website
        );
    }

    public function testConstructor(): void
    {
        $name    = self::$faker->name();
        $website = self::$faker->url();
        assertNotEmpty($name);
        assertNotEmpty($website);
        $assoc = Factory\AssociationFactory::createAssociation(
            $name,
            $website
        );
        self::assertSame(0, $assoc->getId());
        self::assertSame($name, $assoc->getName());
        self::assertSame($website, $assoc->getWebsite());
        self::assertEmpty($assoc->getEntities());
    }

    /**
     * @return void
     */
    public function testGetId(): void
    {
        self::assertSame(0, self::$association->getId());
    }

    /**
     * @return void
     */
    public function testGetSetName(): void
    {
        /** @var non-empty-string $name */
        $name = self::$faker->name();
        self::$association->setName($name);
        static::assertSame($name, self::$association->getName());
    }

    /**
     * @return void
     */
    public function testGetSetWebsite(): void
    {
        /** @var non-empty-string $website */
        $website = self::$faker->url();
        self::$association->setWebsite($website);
        static::assertSame($website, self::$association->getWebsite());
    }

    /**
     * @return void
     */
    public function testGetSetBirthDate(): void
    {
        $bd = self::$faker->dateTime();
        self::$association->setBirthDate($bd);
        static::assertSame($bd, self::$association->getBirthDate());
    }

    /**
     * @return void
     */
    public function testGetSetDeathDate(): void
    {
        $dd = self::$faker->dateTime();
        self::$association->setDeathDate($dd);
        static::assertSame($dd, self::$association->getDeathDate());
    }

    /**
     * @return void
     */
    public function testGetSetImageUrl(): void
    {
        $imageUrl = self::$faker->url();
        self::$association->setImageUrl($imageUrl);
        static::assertSame($imageUrl, self::$association->getImageUrl());
    }

    /**
     * @return void
     */
    public function testGetSetWikiUrl(): void
    {
        $wikiUrl = self::$faker->url();
        self::$association->setWikiUrl($wikiUrl);
        static::assertSame($wikiUrl, self::$association->getWikiUrl());
    }

    /**
     * @return void
     */
    public function testGetAddContainsRemoveEntities(): void
    {
        self::assertEmpty(self::$association->getEntities());
        $slug   = self::$faker->slug();
        assertNotEmpty($slug);
        $entity = Factory\EntityFactory::createElement($slug);

        self::$association->addEntity($entity);
        self::$association->addEntity($entity); // duplicate
        self::assertNotEmpty(self::$association->getEntities());
        self::assertTrue(self::$association->containsEntity($entity));
        self::assertTrue($entity->containsAssociation(self::$association));

        self::$association->removeEntity($entity);
        self::assertFalse(self::$association->containsEntity($entity));
        self::assertCount(0, self::$association->getEntities());
        self::assertFalse(self::$association->removeEntity($entity));
        self::assertFalse($entity->containsAssociation(self::$association));
    }

    /**
     * @return void
     */
    public function testToString(): void
    {
        /** @var non-empty-string $name */
        $name = self::$faker->company();
        $bd   = self::$faker->dateTime();
        $dd   = self::$faker->dateTime();
        /** @var non-empty-string $ws */
        $ws   = self::$faker->url();
        self::$association->setName($name);
        self::$association->setBirthDate($bd);
        self::$association->setDeathDate($dd);
        self::$association->setWebsite($ws);
        $toString = self::$association->__toString();
        self::assertStringContainsString($name, $toString);
        self::assertStringContainsString($bd->format('Y-m-d'), $toString);
        self::assertStringContainsString($dd->format('Y-m-d'), $toString);
        self::assertStringContainsString($ws, $toString);
    }

    /**
     * @return void
     */
    public function testJsonSerialize(): void
    {
        $json = (string) json_encode(self::$association, JSON_PARTIAL_OUTPUT_ON_ERROR);
        self::assertJson($json);
    }
}
